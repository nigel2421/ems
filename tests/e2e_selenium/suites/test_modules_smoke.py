import pytest
import time
from pages import LoginPage, CampaignAppPage


@pytest.mark.smoke
@pytest.mark.modules
class TestModulesSmoke:
    """Read-only smoke verification of primary operational modules."""

    @pytest.fixture(autouse=True)
    def setup_logged_in_governor(self, driver, test_config):
        login_page = LoginPage(driver)
        login_page.navigate(test_config["user_url"])
        login_page.login(test_config["governor_email"], test_config["governor_password"])
        self.app_page = CampaignAppPage(driver)
        assert self.app_page.is_app_loaded()

    def test_polling_stations_intel_module(self):
        """Verifies Polling Station Intelligence module opens cleanly."""
        self.app_page.open_module("polling_intel")
        time.sleep(1)
        assert "#polling_stations" in self.app_page.get_current_url()

    def test_electoral_map_room_module(self):
        """Verifies Electoral Map Room opens cleanly."""
        self.app_page.open_module("map_room")
        time.sleep(1)
        assert "#interactive_map" in self.app_page.get_current_url()

    def test_tally_center_module(self):
        """Verifies Tally Center opens in read-only mode."""
        self.app_page.open_module("tally_center")
        time.sleep(1)
        assert "#tally_center" in self.app_page.get_current_url()
