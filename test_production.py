#!/usr/bin/env python3
"""
SomoAI Production API Testing Script

Tests production API endpoints to ensure everything is working correctly.

Usage:
    python test_production.py
    python test_production.py --url https://your-api.railway.app
"""

import requests
import json
import sys
import argparse
from datetime import datetime


# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")


def print_error(message):
    print(f"{RED}✗ {message}{RESET}")


def print_info(message):
    print(f"{BLUE}ℹ {message}{RESET}")


def print_warning(message):
    print(f"{YELLOW}⚠ {message}{RESET}")


def print_section(title):
    print(f"\n{'='*60}")
    print(f"{BLUE}{title}{RESET}")
    print('='*60)


def test_endpoint(name, url, method='GET', data=None, expected_status=200):
    """Test a single endpoint"""
    print(f"\nTesting: {name}")
    print(f"URL: {url}")

    try:
        if method == 'GET':
            response = requests.get(url, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)
        else:
            response = requests.request(method, url, json=data, timeout=10)

        print(f"Status: {response.status_code}")

        if response.status_code == expected_status:
            print_success(f"{name} passed")
        else:
            print_error(f"{name} failed - Expected {expected_status}, got {response.status_code}")

        # Pretty print response
        try:
            response_data = response.json()
            print(f"Response:\n{json.dumps(response_data, indent=2)}")
        except:
            print(f"Response: {response.text[:200]}")

        return response.status_code == expected_status

    except requests.exceptions.Timeout:
        print_error(f"{name} - Request timed out")
        return False
    except requests.exceptions.ConnectionError:
        print_error(f"{name} - Connection error")
        return False
    except Exception as e:
        print_error(f"{name} - Error: {str(e)}")
        return False


def run_tests(base_url):
    """Run all production tests"""
    print_info(f"Testing SomoAI Production API")
    print_info(f"Base URL: {base_url}")
    print_info(f"Time: {datetime.now().isoformat()}")

    results = {
        'passed': 0,
        'failed': 0,
        'total': 0
    }

    # ========================================================================
    # Monitoring Endpoints
    # ========================================================================
    print_section("MONITORING ENDPOINTS")

    tests = [
        ("Health Check", f"{base_url}/health/", "GET", None, 200),
        ("Ping", f"{base_url}/ping/", "GET", None, 200),
        ("Version", f"{base_url}/version/", "GET", None, 200),
        ("Liveness Probe", f"{base_url}/liveness/", "GET", None, 200),
        ("Readiness Probe", f"{base_url}/readiness/", "GET", None, 200),
    ]

    for test in tests:
        results['total'] += 1
        if test_endpoint(*test):
            results['passed'] += 1
        else:
            results['failed'] += 1

    # ========================================================================
    # API Endpoints (Public)
    # ========================================================================
    print_section("PUBLIC API ENDPOINTS")

    tests = [
        ("Get Subjects", f"{base_url}/api/content/subjects/", "GET", None, 200),
        ("API Schema", f"{base_url}/api/schema/", "GET", None, 200),
    ]

    for test in tests:
        results['total'] += 1
        if test_endpoint(*test):
            results['passed'] += 1
        else:
            results['failed'] += 1

    # ========================================================================
    # Authentication Flow
    # ========================================================================
    print_section("AUTHENTICATION FLOW")

    # Test OTP request with a test number
    test_phone = "+254712345678"
    otp_data = {"phone_number": test_phone}

    results['total'] += 1
    if test_endpoint(
        "Request OTP",
        f"{base_url}/api/auth/request-otp/",
        "POST",
        otp_data,
        200
    ):
        results['passed'] += 1
        print_info("OTP should be sent to the test number")
    else:
        results['failed'] += 1

    # ========================================================================
    # Error Handling
    # ========================================================================
    print_section("ERROR HANDLING")

    tests = [
        ("Invalid Endpoint (404)", f"{base_url}/api/invalid-endpoint/", "GET", None, 404),
        ("Invalid Phone Number", f"{base_url}/api/auth/request-otp/", "POST", {"phone_number": "invalid"}, 400),
    ]

    for test in tests:
        results['total'] += 1
        if test_endpoint(*test):
            results['passed'] += 1
        else:
            results['failed'] += 1

    # ========================================================================
    # Summary
    # ========================================================================
    print_section("TEST SUMMARY")

    pass_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0

    print(f"\nTotal Tests: {results['total']}")
    print_success(f"Passed: {results['passed']}")
    if results['failed'] > 0:
        print_error(f"Failed: {results['failed']}")
    else:
        print_success(f"Failed: {results['failed']}")

    print(f"Pass Rate: {pass_rate:.1f}%\n")

    if results['failed'] == 0:
        print_success("All tests passed! 🎉")
        return 0
    else:
        print_error(f"{results['failed']} test(s) failed")
        return 1


def main():
    parser = argparse.ArgumentParser(description='Test SomoAI Production API')
    parser.add_argument(
        '--url',
        default='https://somoai-backend.railway.app',
        help='Base URL of the production API'
    )

    args = parser.parse_args()

    # Remove trailing slash
    base_url = args.url.rstrip('/')

    # Run tests
    exit_code = run_tests(base_url)

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
