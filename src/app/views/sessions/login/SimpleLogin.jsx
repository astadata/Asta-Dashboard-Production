import { useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { Formik } from "formik";
import * as Yup from "yup";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";

import useAuth from "app/hooks/useAuth";

// STYLED COMPONENTS
const LoginRoot = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#FFFFFF",
  minHeight: "100vh"
});

const LoginCard = styled(Box)({
  width: "100%",
  maxWidth: 450,
  padding: "48px 40px",
  background: "#FFFFFF",
  borderRadius: 0
});

const Logo = styled(Typography)({
  fontSize: 32,
  fontWeight: 700,
  color: "#0D9488",
  marginBottom: 48,
  textAlign: "center",
  letterSpacing: "-0.5px"
});

const StyledTextField = styled(TextField)({
  marginBottom: 24,
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#E5E7EB"
    },
    "&:hover fieldset": {
      borderColor: "#0D9488"
    },
    "&.Mui-focused fieldset": {
      borderColor: "#0D9488"
    }
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#0D9488"
  }
});

const StyledButton = styled(LoadingButton)({
  backgroundColor: "#0D9488",
  color: "#FFFFFF",
  padding: "12px",
  fontSize: 16,
  fontWeight: 600,
  textTransform: "none",
  marginBottom: 16,
  "&:hover": {
    backgroundColor: "#0F766E"
  },
  "&.Mui-disabled": {
    backgroundColor: "#D1D5DB",
    color: "#FFFFFF"
  }
});

const CancelButton = styled(Button)({
  color: "#6B7280",
  padding: "12px",
  fontSize: 16,
  fontWeight: 600,
  textTransform: "none",
  border: "1px solid #E5E7EB",
  "&:hover": {
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB"
  }
});

// initial login credentials
const initialValues = {
  email: "",
  password: ""
};

// form field validation schema
const validationSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  email: Yup.string().email("Invalid email address").required("Email is required")
});

export default function SimpleLogin() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { signInWithEmail } = useAuth();

  const handleFormSubmit = async (values) => {
    try {
      await signInWithEmail(values.email, values.password);
      navigate(state ? state.from : "/dashboard/default");
      enqueueSnackbar("Welcome back!", { variant: "success" });
    } catch (error) {
      // Show user-friendly error messages
      let errorMessage = "Unable to sign in. Please check your credentials.";
      
      if (error.message) {
        if (error.message.includes('user-not-found') || error.message.includes('Account not found')) {
          errorMessage = "Account not found. Please check your email.";
        } else if (error.message.includes('wrong-password') || error.message.includes('Incorrect email')) {
          errorMessage = "Incorrect password. Please try again.";
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = "Too many failed attempts. Please try again later.";
        } else if (error.message.includes('network') || error.message.includes('Unable to sign in')) {
          errorMessage = error.message;
        } else {
          // Use the error message if it's already user-friendly
          errorMessage = error.message;
        }
      }
      
      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <LoginRoot>
      <LoginCard>
        <Logo>ASTADATA Dashboard</Logo>

        <Formik
          onSubmit={handleFormSubmit}
          initialValues={initialValues}
          validationSchema={validationSchema}>
          {({
            values,
            errors,
            touched,
            isSubmitting,
            handleChange,
            handleBlur,
            handleSubmit
          }) => (
            <form onSubmit={handleSubmit}>
              <StyledTextField
                fullWidth
                type="email"
                name="email"
                label="Email"
                variant="outlined"
                onBlur={handleBlur}
                value={values.email}
                onChange={handleChange}
                helperText={touched.email && errors.email}
                error={Boolean(errors.email && touched.email)}
              />

              <StyledTextField
                fullWidth
                name="password"
                type="password"
                label="Password"
                variant="outlined"
                onBlur={handleBlur}
                value={values.password}
                onChange={handleChange}
                helperText={touched.password && errors.password}
                error={Boolean(errors.password && touched.password)}
              />

              <StyledButton
                fullWidth
                type="submit"
                loading={isSubmitting}
                variant="contained"
                disableElevation>
                Login
              </StyledButton>

              <CancelButton
                fullWidth
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}>
                Cancel
              </CancelButton>
            </form>
          )}
        </Formik>
      </LoginCard>
    </LoginRoot>
  );
}
