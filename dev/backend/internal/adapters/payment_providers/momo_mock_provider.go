package payment_providers

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/google/uuid"

	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
)

// MomoMockProvider simulates mobile money payments (MTN, Vodafone, AirtelTigo).
// In production, replace this with the real provider adapter.
type MomoMockProvider struct {
	mu       sync.RWMutex
	sessions map[string]*mockSession // keyed by provider ref
}

type mockSession struct {
	PaymentRef string
	Amount     float64
	Phone      string
	Status     string // pending → completed (auto-approve on verify)
}

func NewMomoMockProvider() *MomoMockProvider {
	return &MomoMockProvider{
		sessions: make(map[string]*mockSession),
	}
}

func (p *MomoMockProvider) Name() string {
	return "momo_mock"
}

func (p *MomoMockProvider) SupportedMethods() []string {
	return []string{"momo", "vodacash", "airteltigo"}
}

func (p *MomoMockProvider) Initiate(_ context.Context, req *portservices.ProviderInitiateRequest) (*portservices.ProviderInitiateResult, error) {
	providerRef := fmt.Sprintf("MOMO-%s", uuid.New().String()[:8])

	p.mu.Lock()
	p.sessions[providerRef] = &mockSession{
		PaymentRef: req.PaymentReference,
		Amount:     req.Amount,
		Phone:      req.PhoneNumber,
		Status:     "pending",
	}
	p.mu.Unlock()

	network := "MTN"
	ussd := fmt.Sprintf("*170*1*1*%s*%.0f#", req.PaymentReference, req.Amount)

	return &portservices.ProviderInitiateResult{
		ProviderRef:  providerRef,
		Status:       "pending",
		USSDCode:     ussd,
		Instructions: fmt.Sprintf("Dial %s on your %s phone (%s) to approve payment of GHS %.2f.", ussd, network, req.PhoneNumber, req.Amount),
	}, nil
}

func (p *MomoMockProvider) Verify(_ context.Context, providerRef string) (*portservices.ProviderVerifyResult, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	session, ok := p.sessions[providerRef]
	if !ok {
		return &portservices.ProviderVerifyResult{
			Status:        "failed",
			StatusMessage: "Transaction not found",
		}, nil
	}

	// Mock: auto-complete on first verify call
	session.Status = "completed"

	rawResp, _ := json.Marshal(map[string]any{
		"mock":       true,
		"providerRef": providerRef,
		"phone":      session.Phone,
		"amount":     session.Amount,
		"status":     "completed",
	})

	return &portservices.ProviderVerifyResult{
		Status:        "completed",
		TransactionID: providerRef,
		StatusMessage: "Payment approved (mock)",
		RawResponse:   string(rawResp),
	}, nil
}
