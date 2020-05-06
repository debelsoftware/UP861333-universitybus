import threading
import requests
from gps3 import gps3
import time
gps = gps3.GPSDSocket()
data = gps3.DataStream()
gps.connect()
gps.watch()

server = 'http://212.47.240.232/gps'

lon = 0;
lat = 0;

def gpsLogger():
    global lon
    global lat
    for new_data in gps:
        if new_data:
            data.unpack(new_data)
            lon = data.TPV['lon']
            lat = data.TPV['lat']
def main():
    print("----BUS TRACKER RUNNING----")
    global lon
    global lat
    global server
    while True:
        try:
            gpsdata = {'lat':lat, 'lon':lon}
            request = requests.post(server, json = gpsdata)
            print(request.status_code, request.reason)
        except:
            print("connection lost, will try agin in 5 seconds")
        time.sleep(5)

        
gpsService = threading.Thread(name='gps service', target=gpsLogger)
mainThread = threading.Thread(name='main', target=main)

gpsService.start()
mainThread.start()
