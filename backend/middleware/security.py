# Security utilities like data masking
class SecurityUtils:
    @staticmethod
    def mask_email(email: str) -> str:
        if "@" in email:
            name, domain = email.split("@")
            return f"{name[0]}***@{domain}"
        return email

security_utils = SecurityUtils()
