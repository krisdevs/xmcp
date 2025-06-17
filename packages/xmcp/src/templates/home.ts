const homeTemplate = (endpoint: string) => `
<!DOCTYPE html>
<html>
  <head>
    <title>xmcp_ MCP Server</title>
    <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        background: #000;
        font-family: 'Geist Mono', monospace;
        color: #fff;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      h1 {
        color: #fff;
        margin-bottom: 16px;
        font-size: 2.5rem;
        font-weight: 400;
        letter-spacing: 1px;
      }
      .endpoint-btn {
        display: inline-block;
        background: #FF4800;
        color: #fff;
        font-family: 'Geist Mono', monospace;
        font-size: 1.1rem;
        font-weight: 400;
        border: none;
        padding: 6px 12px;
        margin-top: 32px;
        text-decoration: none;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <h1>xmcp_</h1>
    <a class="endpoint-btn" href="${endpoint}">ENDPOINT -&gt;</a>
  </body>
</html>
`;

export default homeTemplate;
