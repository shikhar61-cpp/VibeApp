from django.contrib.auth.models import User
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import Follow
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer


class FeedView(generics.ListAPIView):
    """GET  /api/posts/       – paginated feed (following + own posts)
       POST /api/posts/       – create a post
    """
    serializer_class = PostSerializer

    def get_queryset(self):
        user = self.request.user
        # Get IDs of users the current user follows
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        # Include own posts + followed users' posts
        return Post.objects.filter(
            author_id__in=list(following_ids) + [user.id]
        ).select_related('author', 'author__profile').prefetch_related('likes', 'comments')

    def post(self, request):
        serializer = PostSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AllPostsView(generics.ListAPIView):
    """GET /api/posts/explore/ – all posts (explore page)"""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Post.objects.all().select_related('author', 'author__profile').prefetch_related('likes', 'comments')


class PostDetailView(APIView):
    """GET/DELETE /api/posts/<id>/"""

    def get_object(self, pk):
        try:
            return Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return None

    def get(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(PostSerializer(post, context={'request': request}).data)

    def delete(self, request, pk):
        post = self.get_object(pk)
        if not post:
            return Response({'detail': 'Not found.'}, status=404)
        if post.author != request.user:
            return Response({'detail': 'Not authorized.'}, status=403)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LikeToggleView(APIView):
    """POST /api/posts/<id>/like/ – like or unlike"""

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({'liked': False, 'likes_count': post.likes.count()})
        return Response({'liked': True, 'likes_count': post.likes.count()})


class CommentListCreateView(APIView):
    """GET/POST /api/posts/<id>/comments/"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        comments = post.comments.select_related('author', 'author__profile').all()
        return Response(CommentSerializer(comments, many=True, context={'request': request}).data)

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CommentDeleteView(APIView):
    """DELETE /api/comments/<id>/"""

    def delete(self, request, pk):
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        if comment.author != request.user:
            return Response({'detail': 'Not authorized.'}, status=403)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserPostsView(generics.ListAPIView):
    """GET /api/users/<username>/posts/"""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        username = self.kwargs['username']
        return Post.objects.filter(
            author__username=username
        ).select_related('author', 'author__profile').prefetch_related('likes', 'comments')
