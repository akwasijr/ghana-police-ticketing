package repositories

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type TicketRepository interface {
	// Create inserts ticket, ticket_offences in a transaction. Returns the generated ticket number.
	Create(ctx context.Context, ticket *models.Ticket, offences []TicketOffenceInput) (string, error)

	// GetByID returns the full ticket response with offences, photos, notes.
	GetByID(ctx context.Context, ticketID uuid.UUID) (*models.TicketResponse, error)

	// GetByNumber returns the full ticket response by ticket number.
	GetByNumber(ctx context.Context, ticketNumber string) (*models.TicketResponse, error)

	// List returns a paginated list of tickets with filters and search.
	List(ctx context.Context, filter models.TicketFilter, search string, p pagination.Params) ([]models.TicketListItem, int, error)

	// Search returns up to 50 matching tickets for quick search.
	Search(ctx context.Context, query string, filter models.TicketFilter) ([]models.TicketListItem, error)

	// UpdateStatus updates the ticket status.
	UpdateStatus(ctx context.Context, ticketID uuid.UUID, status string) error

	// VoidTicket sets status=cancelled with void metadata.
	VoidTicket(ctx context.Context, ticketID uuid.UUID, voidedBy uuid.UUID, reason string) error

	// ReplaceOffences deletes existing and inserts new offences, recalculating totalFine.
	ReplaceOffences(ctx context.Context, ticketID uuid.UUID, offences []TicketOffenceInput) (float64, error)

	// AppendNote adds a note to the ticket.
	AppendNote(ctx context.Context, ticketID uuid.UUID, officerID uuid.UUID, content string) error

	// GetStats returns aggregate statistics with optional filters.
	GetStats(ctx context.Context, filter models.TicketFilter) (*models.TicketStats, error)

	// ClientCreatedIDExists checks if a ticket with this client ID already exists.
	ClientCreatedIDExists(ctx context.Context, clientID uuid.UUID) (*uuid.UUID, error)

	// SavePhoto inserts a ticket photo record.
	SavePhoto(ctx context.Context, photo *models.TicketPhoto, ticketID uuid.UUID, storagePath, thumbnailPath, mimeType string, fileSize int) error

	// NextTicketNumber generates the next ticket number using the DB sequence.
	NextTicketNumber(ctx context.Context, regionCode string) (string, string, error)
}

// TicketOffenceInput is used when creating/replacing offences on a ticket.
type TicketOffenceInput struct {
	OffenceID uuid.UUID
	Fine      float64
	Notes     *string
}
