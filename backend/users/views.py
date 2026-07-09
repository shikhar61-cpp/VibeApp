from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView

from .models import Profile, Follow
from .serializers import UserSerializer, RegisterSerializer, FollowSerializer


# ─────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────

class RegisterView(APIView):
    """POST /api/auth/register/"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user, context={'request': request}).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """POST /api/auth/login/"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        user = authenticate(username=username, password=password)
        if not user:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user, context={'request': request}).data,
        })


class LogoutView(APIView):
    """POST /api/auth/logout/"""

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'detail': 'Logged out.'})


# ─────────────────────────────────────────────
# Current User
# ─────────────────────────────────────────────

class MeView(APIView):
    """GET /api/users/me/"""

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        user = request.user
        # Update basic fields
        for field in ['first_name', 'last_name', 'email']:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()

        # Update profile
        profile, _ = Profile.objects.get_or_create(user=user)
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']
        profile.save()

        return Response(UserSerializer(user, context={'request': request}).data)


# ─────────────────────────────────────────────
# User Profile
# ─────────────────────────────────────────────

class UserProfileView(APIView):
    """GET /api/users/<username>/"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        return Response(UserSerializer(user, context={'request': request}).data)


class FollowToggleView(APIView):
    """POST /api/users/<username>/follow/ — follow or unfollow"""

    def post(self, request, username):
        try:
            target = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        if target == request.user:
            return Response({'detail': 'Cannot follow yourself.'}, status=400)

        follow, created = Follow.objects.get_or_create(
            follower=request.user, following=target
        )
        if not created:
            follow.delete()
            return Response({'following': False, 'followers_count': target.followers.count()})
        return Response({'following': True, 'followers_count': target.followers.count()})


class FollowerListView(generics.ListAPIView):
    """GET /api/users/<username>/followers/"""
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        username = self.kwargs['username']
        return Follow.objects.filter(following__username=username).select_related('follower', 'following')


class FollowingListView(generics.ListAPIView):
    """GET /api/users/<username>/following/"""
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        username = self.kwargs['username']
        return Follow.objects.filter(follower__username=username).select_related('follower', 'following')


class UserSearchView(APIView):
    """GET /api/users/search/?q=<query>"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([])
        users = User.objects.filter(username__icontains=q)[:10]
        return Response(UserSerializer(users, many=True, context={'request': request}).data)
