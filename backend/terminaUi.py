from wcwidth import wcswidth


CYAN = "\033[36m"
RESET = "\033[0m"


def show_server_status(name):
    title = f"🚀 {name} API Server"

    # Default box width
    width = 32

    # Actual terminal width of title
    title_width = wcswidth(title)

    # Automatically expand for long name
    width = max(width, title_width + 4)

    # Space available inside box
    inner_width = width - 2

    # Center the title
    total_padding = inner_width - title_width
    left_padding = total_padding // 2
    right_padding = total_padding - left_padding

    print(f"{CYAN}┌{'─' * (width - 2)}┐{RESET}")

    print(
        f"{CYAN}│{RESET}"
        f"{' ' * left_padding}"
        f"{title}"
        f"{' ' * right_padding}"
        f"{CYAN}│{RESET}"
    )

    print(f"{CYAN}└{'─' * (width - 2)}┘{RESET}")
