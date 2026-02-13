package storage

import (
	"fmt"
	"os"
	"path/filepath"

	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
)

type localStorage struct {
	basePath string
	baseURL  string
}

func NewLocalStorage(basePath, baseURL string) portservices.StorageService {
	return &localStorage{basePath: basePath, baseURL: baseURL}
}

func (s *localStorage) SaveFile(data []byte, dir, filename string) (string, error) {
	fullDir := filepath.Join(s.basePath, dir)
	if err := os.MkdirAll(fullDir, 0755); err != nil {
		return "", fmt.Errorf("create dir: %w", err)
	}

	relPath := filepath.Join(dir, filename)
	fullPath := filepath.Join(s.basePath, relPath)

	if err := os.WriteFile(fullPath, data, 0644); err != nil {
		return "", fmt.Errorf("write file: %w", err)
	}

	return relPath, nil
}

func (s *localStorage) FileURL(storagePath string) string {
	return s.baseURL + "/" + storagePath
}
