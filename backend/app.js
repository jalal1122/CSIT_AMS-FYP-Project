/**
 * cPanel Phusion Passenger Startup Entry Point
 * 
 * cPanel's "Setup Node.js App" defaults the Application startup file to "app.js".
 * This entrypoint delegates directly to server.js.
 */
import "./server.js";
