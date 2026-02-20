import os
import requests
import time

def ping_url(url, delay, max_trials):
    trials = 0
    while trials < max_trials:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"Website {url} is reachable")
                return True
        except requests.exceptions.ConnectionError as e:
            print(f"Error pinging {url}. Retrying in {delay} seconds.: {e}")
            time.sleep(delay)
            trials += 1
        except requests.exceptions.MissingSchema:
            print(f"Invalid URL format:{url}. Retrying in {delay} seconds.: {e}")
            time.sleep(delay)
            trials += 1
    return False

def run():
    website_url = os.getenv("INPUT_URL")
    delay = int(os.getenv("INPUT_DELAY"))
    max_trials = int(os.getenv("INPUT_MAX_TRIALS"))

    website_reachable = ping_url(website_url, delay, max_trials)

    if website_reachable:
        print(f"Website {website_url} is reachable")
    else:
        print(f"Website {website_url} is not reachable")

if __name__ == "__main__":
    run()

#Normally you should have a way of validating the inputs and parameters
