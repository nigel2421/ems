import os
import pytest
from pathlib import Path
from dotenv import load_dotenv

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

# Load .env.test if present
env_path = Path(__file__).parent / '.env.test'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def pytest_addoption(parser):
    parser.addoption(
        "--env",
        action="store",
        default=os.getenv("EMS_TARGET_ENV", "live"),
        help="Target environment to test: live, staging, local"
    )
    parser.addoption(
        "--headed",
        action="store_true",
        default=False,
        help="Run browser in visible (headed) mode instead of headless"
    )


@pytest.fixture(scope="session")
def test_config(request):
    env_choice = request.config.getoption("--env").lower()

    if env_choice == "local":
        user_url = os.getenv("EMS_LOCAL_USER_URL", "http://localhost:5173")
        admin_url = os.getenv("EMS_LOCAL_ADMIN_URL", "http://ops-konsole.localhost:5173")
    else:
        user_url = os.getenv("EMS_USER_BASE_URL", "https://kuratech.site")
        admin_url = os.getenv("EMS_ADMIN_BASE_URL", "https://ops-konsole.kuratech.site")

    return {
        "env": env_choice,
        "user_url": user_url.rstrip("/"),
        "admin_url": admin_url.rstrip("/"),
        "timeout": int(os.getenv("DEFAULT_TIMEOUT_SEC", "12")),
        "admin_email": os.getenv("TEST_ADMIN_EMAIL", "admin.super@ems.go.ke"),
        "admin_password": os.getenv("TEST_ADMIN_PASSWORD", "dev-local-only-password"),
        "governor_email": os.getenv("TEST_GOVERNOR_EMAIL", "governor.nairobi@ems.go.ke"),
        "governor_password": os.getenv("TEST_GOVERNOR_PASSWORD", "dev-local-only-password"),
        "mp_email": os.getenv("TEST_MP_EMAIL", "mp.westlands@ems.go.ke"),
        "mp_password": os.getenv("TEST_MP_PASSWORD", "dev-local-only-password"),
        "agent_email": os.getenv("TEST_AGENT_EMAIL", "james.agent@ems.go.ke"),
        "agent_password": os.getenv("TEST_AGENT_PASSWORD", "dev-local-only-password")
    }


@pytest.fixture(scope="function")
def driver(request):
    headed_flag = request.config.getoption("--headed")
    env_headless = os.getenv("HEADLESS", "true").lower() in ("true", "1", "yes")
    is_headless = not headed_flag if headed_flag else env_headless

    chrome_options = ChromeOptions()
    if is_headless:
        chrome_options.add_argument("--headless=new")
    
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--ignore-certificate-errors")
    chrome_options.add_argument("--allow-insecure-localhost")

    # Anti-bot detection mitigation for testing
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)

    try:
        service = ChromeService(ChromeDriverManager().install())
        drv = webdriver.Chrome(service=service, options=chrome_options)
    except Exception:
        # Fallback to PATH webdriver if webdriver-manager network fails
        drv = webdriver.Chrome(options=chrome_options)

    drv.set_page_load_timeout(30)
    drv.implicitly_wait(2)

    yield drv

    try:
        drv.quit()
    except Exception:
        pass
