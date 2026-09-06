"""Read-only rosbridge gateway. Public telemetry is NOT private authentication.

Origin checks protect browser access, not hostile non-browser clients. Never connect
this teaching deployment to a real robot or publish confidential telemetry to it.
"""
import asyncio
import json
import os
from http import HTTPStatus
import websockets
from gateway_policy import filter_operation

ORIGINS = [origin.strip() for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
active_connections = 0


async def health(path, headers):
    if headers.get("Upgrade", "").lower() != "websocket":
        return HTTPStatus.OK, [("Content-Type", "text/plain")], b"RoboQuest read-only ROS gateway\n"
    return None


async def handle(client, _path):
    global active_connections
    if active_connections >= 12:
        await client.close(code=1013, reason="Demo capacity reached")
        return
    active_connections += 1
    try:
        async with websockets.connect("ws://127.0.0.1:9090", max_size=1_000_000, max_queue=4) as upstream:
            async def to_ros():
                async for raw in client:
                    try:
                        operation = filter_operation(raw)
                    except (ValueError, TypeError):
                        await client.close(code=1008, reason="Only allowlisted telemetry subscriptions are permitted")
                        return
                    await upstream.send(json.dumps(operation))

            async def to_browser():
                async for raw in upstream:
                    await client.send(raw)

            tasks = [asyncio.create_task(to_ros()), asyncio.create_task(to_browser())]
            try:
                await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            finally:
                for task in tasks:
                    task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
    except (OSError, websockets.ConnectionClosed):
        await client.close(code=1013, reason="ROS runtime unavailable")
    finally:
        active_connections -= 1


async def main():
    async with websockets.serve(handle, "0.0.0.0", int(os.environ.get("PORT", "7860")), origins=ORIGINS, process_request=health, max_size=4096, max_queue=4, ping_interval=20, ping_timeout=20):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())