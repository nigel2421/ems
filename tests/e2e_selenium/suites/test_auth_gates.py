import pytest
import time
from pages import LoginPage, AdminConsolePage, CampaignAppPage


@pytest.mark.smoke
@pytest.mark.security
class TestAuthGatesAndSubdomainSeparation:
    """
    Subdomain Realm Separation & Authentication Verification
    Validates that:
    1. Admin can ONLY log in on the dedicated Operations Console (ops-konsole).
    2. Admin login is DENIED on the campaign domain (kuratech.site).
    3. Campaign user login is DENIED on the Operations Console.
    4. Campaign users log in successfully on the main domain.
    """

    def test_tc_a01_super_admin_login_on_ops_konsole(self, driver, test_config):
        """TC-A01: Super Admin logs in on the dedicated operations console subdomain."""
        login_page = LoginPage(driver)
        admin_page = AdminConsolePage(driver)

        # 1. Navigate to dedicated Operations Console subdomain
        admin_url = test_config["admin_url"]
        login_page.navigate(admin_url)

        # 2. Assert login form is displayed
        assert login_page.is_login_form_displayed(), "Login form should be visible on admin console"

        # 3. Enter Admin credentials
        login_page.login(
            email=test_config["admin_email"],
            password=test_config["admin_password"]
        )

        # 4. Verification: User enters Operations Console
        assert admin_page.is_console_loaded(), "Operations Console shell should load for Super Admin"
        header_text = admin_page.get_header_title()
        assert "Kuratech Operations Console" in header_text, "Console header should be displayed"

    def test_tc_a02_admin_login_denied_on_main_domain(self, driver, test_config):
        """TC-A02: Admin credentials entered on the user domain are strictly DENIED."""
        login_page = LoginPage(driver)

        # 1. Navigate to main campaign domain
        user_url = test_config["user_url"]
        login_page.navigate(user_url)

        # 2. Attempt login with Super Admin credentials
        login_page.login(
            email=test_config["admin_email"],
            password=test_config["admin_password"]
        )

        # 3. Assert generic rejection error is displayed without account enumeration
        time.sleep(0.5)
        assert login_page.has_error(), "System must display error for admin on user domain"
        err = login_page.get_error_message()
        assert "Invalid email address or password" in err, f"Expected generic error, got: {err}"

    def test_tc_a03_campaign_user_denied_on_ops_konsole(self, driver, test_config):
        """TC-A03: Campaign users (Governor/MP) are strictly DENIED on the operations console."""
        login_page = LoginPage(driver)

        # 1. Navigate to Operations Console subdomain
        admin_url = test_config["admin_url"]
        login_page.navigate(admin_url)

        # 2. Attempt login with Governor credentials
        login_page.login(
            email=test_config["governor_email"],
            password=test_config["governor_password"]
        )

        # 3. Assert generic rejection error is displayed
        time.sleep(0.5)
        assert login_page.has_error(), "System must reject non-admin users on operations console"
        err = login_page.get_error_message()
        assert "Invalid email address or password" in err, f"Expected generic error, got: {err}"

    def test_tc_a04_governor_login_on_main_domain(self, driver, test_config):
        """TC-A04: Campaign Governor logs in successfully on the main campaign domain."""
        login_page = LoginPage(driver)
        app_page = CampaignAppPage(driver)

        # 1. Navigate to main campaign domain
        user_url = test_config["user_url"]
        login_page.navigate(user_url)

        # 2. Log in with Governor credentials
        login_page.login(
            email=test_config["governor_email"],
            password=test_config["governor_password"]
        )

        # 3. Assert campaign dashboard loads with Governor role
        assert app_page.is_app_loaded(), "Campaign dashboard layout should load"
        role_text = app_page.get_user_role()
        assert "Governor" in role_text, f"Expected role badge 'Governor', got: {role_text}"
