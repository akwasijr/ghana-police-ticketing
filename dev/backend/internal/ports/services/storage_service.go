package services

type StorageService interface {
	// SaveFile stores file data and returns the storage path.
	SaveFile(data []byte, dir, filename string) (string, error)

	// FileURL returns the public URL for a stored file.
	FileURL(storagePath string) string
}
