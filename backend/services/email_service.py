import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from jinja2 import Template
from decouple import config

# Email Configuration
SMTP_HOST = config("SMTP_HOST", default="smtp.gmail.com")
SMTP_PORT = config("SMTP_PORT", default=587, cast=int)
EMAIL_USER = config("EMAIL_USER", default="")
EMAIL_PASSWORD = config("EMAIL_PASSWORD", default="")
FROM_EMAIL = config("FROM_EMAIL", default=EMAIL_USER)
FROM_NAME = config("FROM_NAME", default="LMS System")


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML version of email body
        text_body: Plain text version (optional)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    # Skip if email not configured
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print(f"Email not configured. Would have sent to {to_email}: {subject}")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg['To'] = to_email
        
        # Add text and HTML parts
        if text_body:
            part1 = MIMEText(text_body, 'plain')
            msg.attach(part1)
        
        part2 = MIMEText(html_body, 'html')
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        
        print(f"Email sent successfully to {to_email}")
        return True
    
    except Exception as e:
        print(f"Failed to send email to {to_email}: {str(e)}")
        return False


def send_password_reset_email(to_email: str, reset_token: str, user_name: str) -> bool:
    """Send password reset email with token link"""
    
    # Frontend URL (configurable)
    frontend_url = config("FRONTEND_URL", default="http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password/{reset_token}"
    
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1F7A8C 0%, #14535E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #1F7A8C; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello {{ user_name }},</p>
                <p>We received a request to reset your password for your LMS account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                    <a href="{{ reset_link }}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">{{ reset_link }}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 LMS System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_body = template.render(user_name=user_name, reset_link=reset_link)
    
    text_body = f"""
    Hello {user_name},
    
    We received a request to reset your password for your LMS account.
    
    Click this link to reset your password:
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request this password reset, please ignore this email.
    
    © 2026 LMS System
    """
    
    return send_email(
        to_email=to_email,
        subject="Password Reset Request - LMS",
        html_body=html_body,
        text_body=text_body
    )


def send_assignment_notification(to_email: str, student_name: str, assignment_title: str, course_title: str) -> bool:
    """Send notification when new assignment is created"""
    
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1F7A8C 0%, #14535E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #fff; padding: 15px; border-left: 4px solid #1F7A8C; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📚 New Assignment Posted</h1>
            </div>
            <div class="content">
                <p>Hello {{ student_name }},</p>
                <p>A new assignment has been posted in your course:</p>
                <div class="highlight">
                    <strong>Course:</strong> {{ course_title }}<br>
                    <strong>Assignment:</strong> {{ assignment_title }}
                </div>
                <p>Log in to your LMS account to view the assignment details and submit your work.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    template = Template(html_template)
    html_body = template.render(
        student_name=student_name,
        assignment_title=assignment_title,
        course_title=course_title
    )
    
    return send_email(
        to_email=to_email,
        subject=f"New Assignment: {assignment_title}",
        html_body=html_body
    )
