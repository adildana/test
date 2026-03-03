from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import auth_views

urlpatterns = [
    path('register/', auth_views.RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    # simple endpoint returning info about the currently authenticated user
    path('user/', auth_views.CurrentUserView.as_view(), name='current_user'),
]
