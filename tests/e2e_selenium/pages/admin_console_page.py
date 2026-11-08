from selenium.webdriver.common.by import By
from .base_page import BasePage


class AdminConsolePage(BasePage):
    """Page Object for the Dedicated Operations Console (ops-konsole.kuratech.site)."""

    CONSOLE_ROOT = (By.CSS_SELECTOR, ".admin-console-root")
    HEADER_TITLE = (By.XPATH, "//*[contains(text(), 'Kuratech Operations Console')]")
    ROLE_BADGE = (By.XPATH, "//*[contains(text(), 'Super Admin') or contains(text(), 'Admin')]")
    LOGOUT_BTN = (By.XPATH, "//button[contains(., 'Sign Out') or contains(., 'Logout')]")

    TAB_OVERVIEW = (By.XPATH, "//button[contains(., 'Overview')]")
    TAB_ACCOUNTS = (By.XPATH, "//button[contains(., 'Accounts')]")
    TAB_GEO = (By.XPATH, "//button[contains(., 'Geo Inspector')]")
    TAB_AUDIT = (By.XPATH, "//button[contains(., 'Audit Trail')]")
    TAB_HEALTH = (By.XPATH, "//button[contains(., 'System Health')]")
    TAB_READINESS = (By.XPATH, "//button[contains(., 'Production Readiness')]")

    def is_console_loaded(self):
        return self.is_visible(self.CONSOLE_ROOT, custom_timeout=8)

    def get_header_title(self):
        return self.get_text(self.HEADER_TITLE)

    def switch_tab(self, tab_name):
        tab_map = {
            "overview": self.TAB_OVERVIEW,
            "accounts": self.TAB_ACCOUNTS,
            "geo": self.TAB_GEO,
            "audit": self.TAB_AUDIT,
            "health": self.TAB_HEALTH,
            "readiness": self.TAB_READINESS
        }
        loc = tab_map.get(tab_name.lower())
        if loc:
            self.safe_click(loc)

    def logout(self):
        if self.is_visible(self.LOGOUT_BTN, custom_timeout=3):
            self.safe_click(self.LOGOUT_BTN)
