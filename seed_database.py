import requests

# First check if backend is up
base_url = "https://weintegrity.onrender.com/api/"
seed_url = "https://weintegrity.onrender.com/api/dev/seed/"

print("Checking if backend is responding...")
try:
    test = requests.get(base_url + "docs/")
    print(f"Backend status: {test.status_code}\n")
except Exception as e:
    print(f"Backend not responding: {e}\n")

print("Sending POST request to seed database...")
print(f"URL: {seed_url}\n")
url = seed_url

try:
    response = requests.post(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}")
    
    try:
        print(f"Response JSON: {response.json()}")
    except:
        pass
    
    if response.status_code == 200:
        print("\n✓ Database seeded successfully!")
    else:
        print("\n✗ Failed to seed database")
except Exception as e:
    print(f"\n✗ Error: {e}")
