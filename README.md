<h1 align="center">
  <a href="https://toggl.com"><img src="https://toggl.com/site/images/media-toolkit/logo_02-644bd26148b73c19d9c91e5baecd8e31.jpg" alt="Toggl" width="200"></a>
</h1>

<h4 align="center">Simple Fitbit app for the leading time tracking tool <a href="https://toggl.com" target="_blank">Toggl</a>.</h4>


<p align="center">
  <a href="#about">About</a> •
  <a href="#download">Download</a> •
  <a href="#build">Build</a>
</p>

# About

  **TogglBit2** is a Toggl time tracking client for the smartwatch Fitbit. It holds only the most simple functionality and lets the user start and stop time entries fast from their wrist.

  TogglBit2 is based on the TogglBit project which has been discontinued by Toggl. 

<br/>
<br/>
<br/>
<img src="img/screenshot_2.0.1_watch.png" alt="TogglBit2">
<br/>
<br/>
<br/>

# Download

TogglBit2 is available in the Fitbit Gallery. Get it <a href="https://gallery.fitbit.com/details/a8b8d73d-4cb4-4dc3-bce8-48dce03ec827">here</a>.

# Build

## Setup Fitbit CLI

#### Install node and npm

Get latest node package from <a href="https://nodejs.org/en/download/">here</a>.

#### Install Fitbit tools (SDK and CLI)

- Open up terminal

- Run command to install SDK
```
npm add --dev @fitbit/sdk
```

- Run command to install CLI
```
npm add --dev @fitbit/sdk-cli
```

## Setup Fitbit OS Simulator

<p>The simulator is available as a download for
<a href="https://simulator-updates.fitbit.com/download/latest/win">Windows</a> or
<a href="https://simulator-updates.fitbit.com/download/latest/mac">macOS</a>.</p>


## Build and run the app

- Open up Fitbit OS Simulator
- Open terminal and go to the project root path
- Execute `npx fitbit` to jump into Fitbit console _(It will ask you to log in to your fitbit account if you are not logged in)_
- Execute `build-and-install` in Fitbit console to build and run the app.

