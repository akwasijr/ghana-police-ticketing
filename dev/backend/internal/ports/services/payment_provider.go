package services

import "context"

// PaymentProvider is the interface that all payment providers must implement.
// Adding a new provider = implement this interface + register it in the ProviderRegistry.
type PaymentProvider interface {
	// Name returns the provider identifier (e.g. "cash", "mtn_momo_mock").
	Name() string

	// SupportedMethods returns the payment methods this provider handles.
	SupportedMethods() []string

	// Initiate starts a payment session. Returns provider reference, status, and instructions.
	Initiate(ctx context.Context, req *ProviderInitiateRequest) (*ProviderInitiateResult, error)

	// Verify checks the payment status with the provider. Returns updated status.
	Verify(ctx context.Context, providerRef string) (*ProviderVerifyResult, error)
}

// ProviderInitiateRequest is the data passed to a provider to start a payment.
type ProviderInitiateRequest struct {
	Amount           float64
	Currency         string
	PaymentReference string
	PhoneNumber      string
	PayerName        string
	PayerEmail       string
	Description      string
}

// ProviderInitiateResult is returned after a provider initiates a payment.
type ProviderInitiateResult struct {
	ProviderRef  string // Provider's transaction reference
	Status       string // "completed" for cash, "pending" for digital
	RedirectURL  string // For card/bank payments
	USSDCode     string // For mobile money
	Instructions string // Human-readable instructions
}

// ProviderVerifyResult is returned when verifying a payment with the provider.
type ProviderVerifyResult struct {
	Status        string // "completed", "pending", "failed"
	TransactionID string // Provider's transaction ID
	StatusMessage string
	RawResponse   string // JSON string of provider response for audit
}

// ProviderRegistry manages payment providers keyed by method name.
type ProviderRegistry struct {
	providers map[string]PaymentProvider
}

func NewProviderRegistry() *ProviderRegistry {
	return &ProviderRegistry{providers: make(map[string]PaymentProvider)}
}

// Register adds a provider for all methods it supports.
func (r *ProviderRegistry) Register(provider PaymentProvider) {
	for _, method := range provider.SupportedMethods() {
		r.providers[method] = provider
	}
}

// Get returns the provider for the given method, or nil if not found.
func (r *ProviderRegistry) Get(method string) PaymentProvider {
	return r.providers[method]
}
