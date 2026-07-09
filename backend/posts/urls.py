from django.urls import path
from .views import (
    FeedView, AllPostsView, PostDetailView,
    LikeToggleView, CommentListCreateView, CommentDeleteView,
    UserPostsView,
)

urlpatterns = [
    path('posts/', FeedView.as_view(), name='feed'),
    path('posts/explore/', AllPostsView.as_view(), name='explore'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/like/', LikeToggleView.as_view(), name='like-toggle'),
    path('posts/<int:pk>/comments/', CommentListCreateView.as_view(), name='comments'),
    path('comments/<int:pk>/', CommentDeleteView.as_view(), name='comment-delete'),
    path('users/<str:username>/posts/', UserPostsView.as_view(), name='user-posts'),
]
