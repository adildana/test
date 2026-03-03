from django.shortcuts import render
from django.views import View


class IndexView(View):
    """Главная страница с поиском комнат."""
    def get(self, request):
        return render(request, 'index.html', {
            'api_url': '/api/'
        })
