package config

import (
	"os"
	"testing"
)

func TestConfig(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := tmpDir + "/config.json"

	// Test NewConfig
	cfg, _ := NewConfig(configPath)
	if cfg.ProviderKeys == nil {
		t.Error("ProviderKeys map should be initialized")
	}

	// Test Set/Get ProviderKey
	cfg.SetProviderKey("test_provider", "test_key")
	if val := cfg.GetProviderKey("test_provider"); val != "test_key" {
		t.Errorf("Expected 'test_key', got '%s'", val)
	}

	// Test Set/Get ActiveModel
	cfg.SetActiveModel("test-model")
	if val := cfg.GetActiveModel(); val != "test-model" {
		t.Errorf("Expected 'test-model', got '%s'", val)
	}

	// Test LoadFromEnv
	os.Setenv("GOOGLE_API_KEY", "google_env_key")
	os.Setenv("OPENAI_API_KEY", "openai_env_key")
	os.Setenv("ACTIVE_MODEL", "env_model")

	// Clean up env vars after test
	defer func() {
		os.Unsetenv("GOOGLE_API_KEY")
		os.Unsetenv("OPENAI_API_KEY")
		os.Unsetenv("ACTIVE_MODEL")
	}()

	cfg.LoadFromEnv()

	if val := cfg.GetProviderKey("google"); val != "google_env_key" {
		t.Errorf("Expected 'google_env_key', got '%s'", val)
	}
	if val := cfg.GetProviderKey("openai"); val != "openai_env_key" {
		t.Errorf("Expected 'openai_env_key', got '%s'", val)
	}
	if val := cfg.GetActiveModel(); val != "env_model" {
		t.Errorf("Expected 'env_model', got '%s'", val)
	}

	// Test Save and Load

	// Create a config and save it
	saveCfg, err := NewConfig(configPath)
	if err != nil {
		t.Fatalf("Failed to save config: %v", err)
	}
	saveCfg.SetProviderKey("save_provider", "save_key")
	saveCfg.SetActiveModel("save-model")

	// Load the config into a new instance
	loadCfg, err := NewConfig(configPath)

	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	} 

	if val := loadCfg.GetProviderKey("save_provider"); val != "save_key" {
		t.Errorf("Expected 'save_key', got '%s'", val)
	}
	if val := loadCfg.GetActiveModel(); val != "save-model" {
		t.Errorf("Expected 'save-model', got '%s'", val)
	}
}
