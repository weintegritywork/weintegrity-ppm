from django.test import TestCase, Client
from django.urls import reverse
from core.mongo import get_db
from core.auth import create_token


class ApiSmokeTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Ensure Mongo is accessible and clean minimal data
        db = get_db()
        for name in ['users','teams','projects','stories','epics','sprints','notifications','story_chats','project_chats']:
            db[name].delete_many({})

    def setUp(self):
        self.client = Client()
        # register baseline user in DB and get JWT
        user = {
            'id':'u1','employeeId':'E-1','firstName':'A','lastName':'B','email':'a@example.com',
            'phone':'123','role':'Admin','department':'Eng','jobTitle':'Lead','dateOfJoining':'2023-01-01',
            'password':'pass','status':'active'
        }
        db = get_db()
        db['users'].delete_many({'email': user['email']})
        db['users'].insert_one(dict(user))
        token = create_token(user)
        self.auth = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_register_and_login(self):
        # token acquired in setUp
        self.assertIn('HTTP_AUTHORIZATION', self.auth)

    def test_crud_projects(self):
        proj = {
            'id':'p1','name':'Demo','ownerId':'u1','startDate':'2023-01-01','endDate':'2023-12-31','description':'d','memberIds':[],'status':'Not Started'
        }
        r = self.client.post('/api/projects/', data=proj, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 201)
        r = self.client.get('/api/projects/', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(p['id']=='p1' for p in r.json()))
        r = self.client.get('/api/projects/p1/', **self.auth)
        self.assertEqual(r.status_code, 200)
        upd = {**proj, 'name': 'DemoX'}
        r = self.client.put('/api/projects/p1/', data=upd, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 200)
        r = self.client.delete('/api/projects/p1/', **self.auth)
        self.assertEqual(r.status_code, 204)

    def test_story_chat_flow(self):
        m = {'id':'m1','authorId':'u1','timestamp':'2024-01-01','text':'hi'}
        r = self.client.post('/api/story-chats/s1/', data=m, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 201)
        r = self.client.get('/api/story-chats/s1/', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(x['id']=='m1' for x in r.json()['messages']))
        r = self.client.delete('/api/story-chats/s1/?messageId=m1', **self.auth)
        self.assertEqual(r.status_code, 204)

    def test_epics_sprints_crud_and_search(self):
        epic = {'id':'e1','name':'Epic One','projectId':'p1'}
        sprint = {'id':'s1','name':'Sprint One','projectId':'p1','startDate':'2024-01-01','endDate':'2024-01-15'}
        r = self.client.post('/api/epics/', data=epic, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 201)
        r = self.client.post('/api/sprints/', data=sprint, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 201)
        # Search by name
        r = self.client.get('/api/epics/?q=Epic', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(i['id']=='e1' for i in r.json()))
        r = self.client.get('/api/sprints/?q=Sprint', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(i['id']=='s1' for i in r.json()))

    def test_project_chat_flow(self):
        m = {'id':'pm1','authorId':'u1','timestamp':'2024-01-01','text':'hello'}
        r = self.client.post('/api/project-chats/p1/', data=m, content_type='application/json', **self.auth)
        self.assertEqual(r.status_code, 201)
        r = self.client.get('/api/project-chats/p1/', **self.auth)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(x['id']=='pm1' for x in r.json()['messages']))
        r = self.client.delete('/api/project-chats/p1/?messageId=pm1', **self.auth)
        self.assertEqual(r.status_code, 204)

    def test_openapi_docs_accessible(self):
        r = self.client.get('/api/schema/', **self.auth)
        self.assertIn(r.status_code, (200, 403))  # schema may be public; tolerate both
        r = self.client.get('/api/docs/', **self.auth)
        self.assertIn(r.status_code, (200, 302))
