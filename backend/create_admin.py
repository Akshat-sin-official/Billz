import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'commerce_project.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
email = 'demo2233@gmail.com'
password = 'Password123!'

if not User.objects.filter(email=email).exists():
    print(f"Creating superuser for {email}...")
    User.objects.create_superuser(email=email, password=password)
    print("Superuser created successfully!")
else:
    print(f"User {email} already exists. Updating password...")
    user = User.objects.get(email=email)
    user.set_password(password)
    user.save()
    print("Password updated successfully!")
