from selenium.webdriver.common.by import By
from .base_page import BasePage


class CampaignAppPage(BasePage):
    """Page Object for the Campaign Web Application (kuratech.site)."""

    APP_LAYOUT = (By.CSS_SELECTOR, ".admin-layout")
    ROLE_BADGE = (By.CSS_SELECTOR, ".role-badge")
    USER_NAME = (By.CSS_SELECTOR, ".admin-profile-btn strong")
    RELOCATION_NOTICE = (By.XPATH, "//*[contains(text(), 'Operations Console Relocated')]")
    PROFILE_BTN = (By.CSS_SELECTOR, ".admin-profile-btn")
    LOGOUT_BTN = (By.XPATH, "//button[contains(., 'Sign Out') or contains(., 'Logout')]")

    NAV_DASHBOARD = (By.XPATH, "//button[contains(., 'Dashboard')]")
    NAV_MAP_ROOM = (By.XPATH, "//button[contains(., 'Electoral Map Room')]")
    NAV_STRATEGY = (By.XPATH, "//button[contains(., 'Strategy')]")
    NAV_POLLING_INTEL = (By.XPATH, "//button[contains(., 'Polling Intel')]")
    NAV_AGENTS = (By.XPATH, "//button[contains(., 'Agent Management')]")
    NAV_TALLY_CENTER = (By.XPATH, "//button[contains(., 'Tally Center')]")

    def is_app_loaded(self):
        return self.is_visible(self.APP_LAYOUT, custom_timeout=8)

    def get_user_role(self):
        if self.is_visible(self.ROLE_BADGE, custom_timeout=4):
            return self.get_text(self.ROLE_BADGE)
        return ""

    def get_user_name(self):
        if self.is_visible(self.USER_NAME, custom_timeout=4):
            return self.get_text(self.USER_NAME)
        return ""

    def has_relocation_notice(self):
        return self.is_visible(self.RELOCATION_NOTICE, custom_timeout=4)

    def open_module(self, module_name):
        nav_map = {
            "dashboard": self.NAV_DASHBOARD,
            "map_room": self.NAV_MAP_ROOM,
            "strategy": self.NAV_STRATEGY,
            "polling_intel": self.NAV_POLLING_INTEL,
            "agents": self.NAV_AGENTS,
            "tally_center": self.NAV_TALLY_CENTER
        }
        loc = nav_map.get(module_name.lower())
        if loc and self.is_visible(loc, custom_timeout=4):
            self.safe_click(loc)

    def logout(self):
        if self.is_visible(self.PROFILE_BTN, custom_timeout=3):
            self.safe_click(self.PROFILE_BTN)
        if self.is_visible(self.LOGOUT_BTN, custom_timeout=3):
            self.safe_click(self.LOGOUT_BTN)
