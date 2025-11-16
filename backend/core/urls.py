from django.urls import path
from .views import (
    LoginView, RegisterView, RefreshView,
    ForgotPasswordView, VerifyOtpView, ResetPasswordView,
    UsersView, TeamsView, ProjectsView, StoriesView,
    EpicsView, SprintsView, NotificationsView,
    StoryChatsView, ProjectChatsView
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/refresh/', RefreshView.as_view(), name='refresh'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/verify-otp/', VerifyOtpView.as_view(), name='verify-otp'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    path('users/', UsersView.as_view(), name='users-list'),
    path('users/<str:id>/', UsersView.as_view(), name='users-detail'),

    path('teams/', TeamsView.as_view(), name='teams-list'),
    path('teams/<str:id>/', TeamsView.as_view(), name='teams-detail'),

    path('projects/', ProjectsView.as_view(), name='projects-list'),
    path('projects/<str:id>/', ProjectsView.as_view(), name='projects-detail'),

    path('stories/', StoriesView.as_view(), name='stories-list'),
    path('stories/<str:id>/', StoriesView.as_view(), name='stories-detail'),

    path('epics/', EpicsView.as_view(), name='epics-list'),
    path('epics/<str:id>/', EpicsView.as_view(), name='epics-detail'),

    path('sprints/', SprintsView.as_view(), name='sprints-list'),
    path('sprints/<str:id>/', SprintsView.as_view(), name='sprints-detail'),

    path('notifications/', NotificationsView.as_view(), name='notifications-list'),
    path('notifications/<str:id>/', NotificationsView.as_view(), name='notifications-detail'),

    path('story-chats/<str:storyId>/', StoryChatsView.as_view(), name='story-chats'),
    path('project-chats/<str:projectId>/', ProjectChatsView.as_view(), name='project-chats'),
]


