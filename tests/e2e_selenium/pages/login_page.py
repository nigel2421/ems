import time
from selenium.webdriver.common.by import By
from .base_page import BasePage


class LoginPage(BasePage):
    """Page Object for the EMS Authentication Interface."""

    EMAIL_INPUT = (By.ID, "auth-email")
    PASSWORD_INPUT = (By.ID, "auth-password")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "form.auth-form button[type='submit']")
    ERROR_ALERT = (By.CSS_SELECTOR, ".auth-alert")
    BRAND_HEADING = (By.CSS_SELECTOR, ".auth-brand h1")
    FORM_TITLE = (By.CSS_SELECTOR, ".auth-form h2")

    def login(self, email, password):
        self.type_text(self.EMAIL_INPUT, email)
        self.type_text(self.PASSWORD_INPUT, password)
        # Give a small pause for React state to bind before submitting
        time.sleep(0.3)
        self.safe_click(self.SUBMIT_BUTTON)

    def get_error_message(self):
        if self.is_visible(self.ERROR_ALERT, custom_timeout=5):
            return self.get_text(self.ERROR_ALERT)
        return ""

    def has_error(self):
        return self.is_visible(self.ERROR_ALERT, custom_timeout=5)

    def is_login_form_displayed(self):
        return self.is_visible(self.EMAIL_INPUT, custom_timeout=5)

    def get_brand_heading_text(self):
        return self.get_text(self.BRAND_HEADING)
