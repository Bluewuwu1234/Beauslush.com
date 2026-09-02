document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const content = Array.from(body.children).filter(element => element.tagName !== 'SCRIPT');

    const header = document.createElement('header');
    header.innerHTML = `
        <nav class="navbar navbar-light bg-white border-bottom box-shadow mb-3">
            <div class="container">
                <a class="navbar-brand" href="index.html">
                    <img src="images/Beauslush-logo.png" alt="BeauSlush" class="nav-logo">
                </a>
                <div id="siteNavigation">
                    <ul class="navbar-nav flex-grow-1">
                        <li class="nav-item"><a class="nav-link text-dark" href="Credits.html">Credits</a></li>
                    </ul>
                </div>
            </div>
        </nav>`;

    const main = document.createElement('main');
    main.className = 'container pb-3';
    content.forEach(element => main.appendChild(element));

    const footer = document.createElement('footer');
    footer.className = 'border-top footer text-muted';
    footer.innerHTML = '<div class="container">&copy; 2026 - <a href="index.html">beauslush.com</a> - V1.0</div>';

    body.replaceChildren(header, main, footer, ...Array.from(body.querySelectorAll('script')));
});
