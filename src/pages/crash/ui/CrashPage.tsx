import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export function CrashPage() {
  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Что-то пошло не так
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Произошла непредвиденная ошибка. Перезагрузите страницу — обычно это помогает.
      </Typography>
      <Button variant="contained" onClick={() => window.location.reload()}>
        Перезагрузить страницу
      </Button>
    </Container>
  );
}
