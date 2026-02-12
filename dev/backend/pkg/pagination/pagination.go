package pagination

import (
	"net/http"
	"strconv"
)

const (
	DefaultPage  = 1
	DefaultLimit = 20
	MaxLimit     = 100
)

// Params holds parsed pagination and sorting parameters.
type Params struct {
	Page      int
	Limit     int
	SortBy    string
	SortOrder string
	Search    string
}

// Meta holds pagination metadata for responses.
type Meta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

// Parse extracts pagination parameters from the request query string.
func Parse(r *http.Request, allowedSorts []string, defaultSort string) Params {
	p := Params{
		Page:      DefaultPage,
		Limit:     DefaultLimit,
		SortBy:    defaultSort,
		SortOrder: "asc",
	}

	if v := r.URL.Query().Get("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			p.Page = n
		}
	}

	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			p.Limit = n
			if p.Limit > MaxLimit {
				p.Limit = MaxLimit
			}
		}
	}

	if v := r.URL.Query().Get("sortBy"); v != "" {
		for _, s := range allowedSorts {
			if v == s {
				p.SortBy = v
				break
			}
		}
	}

	if v := r.URL.Query().Get("sortOrder"); v == "desc" {
		p.SortOrder = "desc"
	}

	p.Search = r.URL.Query().Get("search")

	return p
}

// Offset returns the SQL offset value.
func (p Params) Offset() int {
	return (p.Page - 1) * p.Limit
}

// NewMeta creates pagination metadata.
func NewMeta(page, limit, total int) Meta {
	totalPages := total / limit
	if total%limit != 0 {
		totalPages++
	}
	if totalPages == 0 {
		totalPages = 1
	}
	return Meta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}
}
