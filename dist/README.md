
## USAGE

```typescript

// Start.
const settings = {
    console: window.console, // Log here too.
    
    // Init app settings (for the buttons and such)....
};
window.MixDOMDebug.startDebug(host, settings);

// Get.
window.MixDOMDebug.currentDebug; // MixDOMDebug | null;

// Stop.
window.MixDOMDebug.stopDebug();

```

## GLOBAL vs. IMPORT/REQUIRE

### GLOBAL
- Include the script from UNPKG.
- And then just use its static method to open a new window.
    - <-- ADD THE CSS BY JS ..! .... from UNPKG, too..!

### IMPORT/REQUIRE:
  - Can import it as a module.
  - In that case, it uses the MixDOM you have.
  - Then likewise start up in a new window.
