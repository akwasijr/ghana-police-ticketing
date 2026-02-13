package payment_providers

import (
	"context"
	"fmt"

	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
)

// CashProvider handles cash payments at police stations.
// Cash payments complete immediately — no external provider call.
type CashProvider struct{}

func NewCashProvider() *CashProvider {
	return &CashProvider{}
}

func (p *CashProvider) Name() string {
	return "cash"
}

func (p *CashProvider) SupportedMethods() []string {
	return []string{"cash"}
}

func (p *CashProvider) Initiate(_ context.Context, req *portservices.ProviderInitiateRequest) (*portservices.ProviderInitiateResult, error) {
	return &portservices.ProviderInitiateResult{
		ProviderRef:  fmt.Sprintf("CASH-%s", req.PaymentReference),
		Status:       "completed",
		Instructions: fmt.Sprintf("Cash payment of GHS %.2f received for %s.", req.Amount, req.PaymentReference),
	}, nil
}

func (p *CashProvider) Verify(_ context.Context, providerRef string) (*portservices.ProviderVerifyResult, error) {
	return &portservices.ProviderVerifyResult{
		Status:        "completed",
		TransactionID: providerRef,
		StatusMessage: "Cash payment verified",
	}, nil
}
