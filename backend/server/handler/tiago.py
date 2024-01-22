from aiohttp import web
from ..handler.shared import routes
from dataclasses import dataclass, asdict

@dataclass
class TiagoState:
    x: float
    y: float


class Tiago:
    state: TiagoState
    
    def __init__(self):
        self.state = TiagoState(x=0, y=0)
        
        
tiago = Tiago()
        

@routes.get("/tiago_state")
async def tiago_state(request):
    
    return web.json_response(asdict(tiago.state))