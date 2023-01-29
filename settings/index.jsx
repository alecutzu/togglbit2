function mySettings(props) {
  return (
    <Page>
      <Section
        description={<Text>Add your Toggl account API token here so we can log you in</Text>}
        title={<Text bold align="center">Toggl Account</Text>}>
        <TextInput
          label="Api token"
          settingsKey="token"
          placeholder="token"
        />
      </Section>
      <Section
        description={<Text>Application preferences</Text>}
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
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);
