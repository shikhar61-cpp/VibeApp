from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView,
    MeView, UserProfileView, FollowToggleView,
    FollowerListView, FollowingListView, UserSearchView,
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # Users
    path('users/me/', MeView.as_view(), name='me'),
    path('users/search/', UserSearchView.as_view(), name='user-search'),
    path('users/<str:username>/', UserProfileView.as_view(), name='user-profile'),
    path('users/<str:username>/follow/', FollowToggleView.as_view(), name='follow-toggle'),
    path('users/<str:username>/followers/', FollowerListView.as_view(), name='followers'),
    path('users/<str:username>/following/', FollowingListView.as_view(), name='following'),
]
