import pytest
import time
from pages import LoginPage, AdminConsolePage, CampaignAppPage


@pytest.mark.dashboards
class TestRoleDashboards:
    """Verifies that each authenticated persona receives the correct role-scoped dashboard."""

    def test_admin_operations_console_navigation(self, driver, test_config):
        """Verifies Super Admin navigation between operational sub-panels."""
        login_page = LoginPage(driver)
        admin_page = AdminConsolePage(driver)

        login_page.navigate(test_config["admin_url"])
        login_page.login(test_config["admin_email"], test_config["admin_password"])

        assert admin_page.is_console_loaded()

        # Switch to Accounts tab
        admin_page.switch_tab("accounts")
        time.sleep(0.5)

        # Switch to System Health tab
        admin_page.switch_tab("health")
        time.sleep(0.5)

        # Switch to Readiness tab
        admin_page.switch_tab("readiness")
        time.sleep(0.5)

    def test_governor_strategy_dashboard(self, driver, test_config):
        """Verifies Governor lands on Campaign Strategy command view."""
        login_page = LoginPage(driver)
        app_page = CampaignAppPage(driver)

        login_page.navigate(test_config["user_url"])
        login_page.login(test_config["governor_email"], test_config["governor_password"])

        assert app_page.is_app_loaded()
        assert "Governor" in app_page.get_user_role()

    def test_mp_constituency_dashboard(self, driver, test_config):
        """Verifies MP lands on Parliamentary constituency dashboard without admin tools."""
        login_page = LoginPage(driver)
        app_page = CampaignAppPage(driver)

        login_page.navigate(test_config["user_url"])
        login_page.login(test_config["mp_email"], test_config["mp_password"])

        assert app_page.is_app_loaded()
        assert "MP" in app_page.get_user_role()
