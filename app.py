import streamlit as st
import requests
import os
from streamlit_card import card

PINGLOW_HOST = os.environ.get("PINGLOW_HOST", "localhost")
PINGLOW_PORT = os.environ.get("PINGLOW_PORT", "8000")

pinglow_base_url = f"http://{PINGLOW_HOST}:{PINGLOW_PORT}"

st.title("Pinglow")

checks_with_status = []

st.markdown(
    """
    <style>
        .main .block-container {
            padding-top: 2rem;
            padding-bottom: 2rem;
            padding-left: 2rem;
            padding-right: 2rem;
            max-width: 100% !important;
        }
    </style>
    """,
    unsafe_allow_html=True
)


def get_color_from_status(status):
    color_map = {
        "Critical" : "#eb4034", # red
        "Ok" : "#5cd145", # green
        "Warning" : "#f2ec33", # yellow,
        "CheckError" : "#d555f2"  # purple
    }
    return color_map.get(status, "#5cd145")

try:
    # Call the API
    response = requests.get(f"{pinglow_base_url}/checks")
    response.raise_for_status()
    checks = response.json()

    for check in checks:
        check_status = requests.get(f"{pinglow_base_url}/check-status/{check['check_name']}")
        check_status.raise_for_status()

        check_status = check_status.json()
        checks_with_status.append(check_status)        

except requests.exceptions.RequestException as e:
    st.error(f"Error retrieving checks results: {e}")


for check in checks_with_status:
    card(
    title=check["check_name"],
    text=check["output"],
    styles={
        "card": {
            "background-color": get_color_from_status(check["status"]),
            "width": "100%"
        },
        "filter": {
            "background-color": "rgba(0, 0, 0, 0)"  # <- make the image not dimmed anymore
        }
    }
)
