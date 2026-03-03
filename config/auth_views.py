from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .auth_serializers import RegisterSerializer, UserSerializer


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя."""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'id': user.id, 'username': user.username},
            status=status.HTTP_201_CREATED
        )


class LogoutView(generics.GenericAPIView):
    """Выход (для JWT — клиент удаляет токен; endpoint для совместимости)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({'detail': 'Вы вышли из системы.'})


class CurrentUserView(generics.RetrieveAPIView):
    """Простая вьюшка, возвращающая данные текущего пользователя."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
