from app.services.paper_service import PaperService
from app.services.search_service import SearchService
from app.services.chat_service import ChatService

def get_paper_service():
    return PaperService()

def get_search_service():
    return SearchService()

def get_chat_service():
    return ChatService()
