import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export function HomePage() {
  return (
    <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" component="h1">
        Скачать фото и видео с Wildberries
      </Typography>
    </Container>
  );
}
