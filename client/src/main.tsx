<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Clarity App</title>
  </head>
  <body>
    <div id="splash-screen" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#8FAE97;z-index:9999;transition:opacity 0.6s ease;">
      <div style="width:10px;height:10px;border-radius:9999px;background:#EAEDE8;opacity:0.9;"></div>
    </div>
    <div id="root"></div>
    <script>
      window.addEventListener('load', () => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
          splash.style.opacity = '0';
          setTimeout(() => splash.remove(), 600);
        }
      });
    </script>
  </body>
</html>
