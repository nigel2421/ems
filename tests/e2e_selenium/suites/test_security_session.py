import pytest
import time
from pages import LoginPage, CampaignAppPage


@pytest.mark.security
class TestSecurityAndSession:
    """Session lifecycle, logout security, and enumeration defense."""

    def test_logout_flow_and_session_clearing(self, driver, test_config):
        """Verifies that logging out terminates the session and prevents back-button bypass."""
        login_page = LoginPage(driver)
        app_page = CampaignAppPage(driver)

        # 1. Log in as Governor
        login_page.navigate(test_config["user_url"])
        login_page.login(test_config["governor_email"], test_config["governor_password"])
        assert app_page.is_app_loaded()

        # 2. Trigger logout
        app_page.logout()
        time.sleep(1)

        # 3. Assert return to login screen
        assert login_page.is_login_form_displayed(), "Should redirect to login screen upon logout"

        # 4. Attempt browser Back button bypass
        driver.back()
        time.sleep(1)

        # Protected dashboard must NOT be restored
        assert login_page.is_login_form_displayed(), "Back button must not restore authenticated session"

    def test_generic_error_without_account_enumeration(self, driver, test_config):
        """Verifies that non-existent accounts receive identical generic error to wrong passwords."""
        login_page = LoginPage(driver)
        login_page.navigate(test_config["user_url"])

        # Attempt with random non-existent email
        login_page.login("nonexistent.officer.999@external.org", "ArbitraryPassword123!")
        time.sleep(0.5)

        assert login_page.has_error()
        err = login_page.get_error_message()
        assert "Invalid email address or password credentials" in err
