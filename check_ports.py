import socket

ports = [3000, 8761, 8080, 8081, 8082, 8083, 8084]
print("--- Port Status Check ---")
for p in ports:
    s = socket.socket()
    s.settimeout(1)
    res = s.connect_ex(("127.0.0.1", p))
    status = "UP (OPEN)" if res == 0 else "STARTING / DOWN"
    print(f"Port {p}: {status}")
    s.close()
