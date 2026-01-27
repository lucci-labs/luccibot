package vault

import (
	"errors"
	"fmt"
)

// Vault defines the interface for secure operations.
type Vault interface {
	SignTransaction(txData []byte) ([]byte, error)
}

// LocalVault is a implementation of Vault that (eventually) uses the OS Keychain.
type LocalVault struct {
	// Placeholder for future OS Keychain integration fields
	keyID string
}

// NewLocalVault creates a new instance of LocalVault.
func NewLocalVault(keyID string) *LocalVault {
	return &LocalVault{
		keyID: keyID,
	}
}

// SignTransaction currently returns a mock signature.
func (v *LocalVault) SignTransaction(txData []byte) ([]byte, error) {
	if len(txData) == 0 {
		return nil, errors.New("transaction data is empty")
	}

	// TODO: Replace with actual signing logic using the key stored in OS Keychain.
	// For now, we return a mock signature for architectural validation.
	fmt.Printf("Vault: Signing data for key %s\n", v.keyID)
	mockSignature := []byte(fmt.Sprintf("mock_sig_for_%s", string(txData)))
	
	return mockSignature, nil
}