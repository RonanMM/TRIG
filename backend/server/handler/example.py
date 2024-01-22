from aiohttp import web
from ..handler.shared import routes

@routes.get("/example")
async def example(request):
    return web.json_response({"message": "Hello, Ronan!"})