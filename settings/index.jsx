function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">Toggl Account</Text>}>
        <TextInput
          label="API Token"
          settingsKey="token"
          placeholder="token"
        />
        <Text>See&nbsp;
        <Link source="https://track.toggl.com/profile">https://track.toggl.com/profile</Link></Text>
      </Section>
      <Section
        title={<Text bold align="center">Preferences</Text>}>
        <TextInput
          label="Default time entry description"
          settingsKey="description"
          placeholder="description"
        />
        <Toggle
            settingsKey="trackAfk"
            label="Detect AFK"
        />
        <Toggle
            settingsKey="pomEn"
            label="Pomodoro timer"
        />
        <Slider
          label={`Pomodoro focus interval ${props.settings.pomFocusMins}min`}
          settingsKey="pomFocusMins"
          step="5"
          min="10"
          max="60"
        />
        
        <Slider
          label={`Pomodoro break interval ${props.settings.pomBreakMins}min`}
          settingsKey="pomBreakMins"
          min="5"
          max="20"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
