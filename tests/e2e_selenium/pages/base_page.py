from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class BasePage:
    """Base Page Object with robust explicit waits and resilient actions."""

    def __init__(self, driver, timeout=12):
        self.driver = driver
        self.timeout = timeout
        self.wait = WebDriverWait(self.driver, self.timeout)

    def navigate(self, url):
        self.driver.get(url)

    def find_visible(self, locator):
        return self.wait.until(EC.visibility_of_element_located(locator))

    def find_clickable(self, locator):
        return self.wait.until(EC.element_to_be_clickable(locator))

    def safe_click(self, locator):
        el = self.find_clickable(locator)
        el.click()
        return el

    def type_text(self, locator, text, clear_first=True):
        el = self.find_visible(locator)
        if clear_first:
            el.clear()
        el.send_keys(text)
        return el

    def get_text(self, locator):
        el = self.find_visible(locator)
        return el.text.strip()

    def is_present(self, locator, custom_timeout=3):
        try:
            WebDriverWait(self.driver, custom_timeout).until(
                EC.presence_of_element_located(locator)
            )
            return True
        except (TimeoutException, NoSuchElementException):
            return False

    def is_visible(self, locator, custom_timeout=3):
        try:
            WebDriverWait(self.driver, custom_timeout).until(
                EC.visibility_of_element_located(locator)
            )
            return True
        except (TimeoutException, NoSuchElementException):
            return False

    def get_current_url(self):
        return self.driver.current_url

    def get_page_title(self):
        return self.driver.title
