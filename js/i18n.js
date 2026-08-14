// Copied verbatim from the Android original:
// app/src/main/res/values/strings.xml and values-cs/strings.xml
export const STRINGS = {
  en: {
    app_name: 'Dixit Score',
    new_game: 'New Game',
    add_player: 'Add Player',
    storyteller: 'Storyteller',
    next_storyteller: 'Next Storyteller',
    add_new_player_title: 'Add New Player',
    edit_player_title: 'Edit Player',
    player_name_label: 'Player Name',
    add_button: 'Add',
    save_button: 'Save',
    cancel_button: 'Cancel',
    delete_button: 'Delete',
    back_button: 'Back',
    delete_player_confirmation_title: 'Delete Player',
    delete_player_confirmation_message:
      'Are you sure you want to delete %1$s? This action cannot be undone.',
    scoring_button: 'Scoring',
    scoring_button_round: 'Scoring for round %1$d',
    edit_score_button: 'Edit Score',
    scoring_dialog_title: 'Round Scoring',
    scoring_dialog_question: "Which players guessed the storyteller's card?",
    scoring_dialog_storyteller_label: 'Storyteller:',
    scoring_bonus_votes_title: 'Bonus Points',
    scoring_bonus_votes_question: 'Whose card received bonus votes?',
    scoring_bonus_votes_points_to_distribute: 'Points to distribute: %1$d',
    scoring_bonus_votes_select_card: 'Select players whose cards received votes:',
    scoring_bonus_votes_assign_points: 'Assign points:',
    scoring_bonus_votes_remove_player: 'Remove player from bonus list',
    select_all: 'Everyone',
    confirm_button: 'Confirm',
    edit_score_dialog_title: 'Edit Scores',
    max_players_reached: 'You have reached the maximum number of players',
  },
  cs: {
    app_name: 'Dixit Skóre',
    new_game: 'Nová hra',
    add_player: 'Přidat hráče',
    storyteller: 'Vypravěč',
    next_storyteller: 'Další vypravěč',
    add_new_player_title: 'Přidat nového hráče',
    edit_player_title: 'Upravit hráče',
    player_name_label: 'Jméno hráče',
    add_button: 'Přidat',
    save_button: 'Uložit',
    cancel_button: 'Zrušit',
    delete_button: 'Smazat',
    back_button: 'Zpět',
    delete_player_confirmation_title: 'Smazat hráče',
    delete_player_confirmation_message:
      'Opravdu si přejete smazat hráče %1$s? Tuto akci nelze vrátit.',
    scoring_button: 'Hodnocení',
    scoring_button_round: 'Hodnocení pro %1$d. kolo',
    edit_score_button: 'Upravit skóre',
    scoring_dialog_title: 'Bodování kola',
    scoring_dialog_question: 'Kteří hráči poznali vypravěčovu kartu?',
    scoring_dialog_storyteller_label: 'Vypravěč:',
    scoring_bonus_votes_title: 'Bonusové body',
    scoring_bonus_votes_question: 'Čí karta dostala bonusové hlasy?',
    scoring_bonus_votes_points_to_distribute: 'Zbývá rozdělit: %1$d b.',
    scoring_bonus_votes_select_card: 'Vyberte hráče, jejichž karty dostaly hlasy:',
    scoring_bonus_votes_assign_points: 'Přiřaďte body:',
    scoring_bonus_votes_remove_player: 'Odebrat hráče ze seznamu',
    select_all: 'Všichni',
    confirm_button: 'Potvrdit',
    edit_score_dialog_title: 'Upravit skóre',
    max_players_reached: 'Dosáhli jste maximálního počtu hráčů',
  },
};

const FALLBACK = 'en';

/** Replaces %1$s / %1$d placeholders with positional arguments. */
function format(template, args) {
  return template.replace(/%(\d+)\$[sd]/g, (_, index) => String(args[index - 1] ?? ''));
}

/** Translates into an explicit language. Exported for testing. */
export function translate(lang, key, ...args) {
  const dictionary = STRINGS[lang] ?? STRINGS[FALLBACK];
  const template = dictionary[key] ?? STRINGS[FALLBACK][key];
  if (template === undefined) return key;
  return args.length ? format(template, args) : template;
}

const currentLang = (globalThis.navigator?.language ?? FALLBACK).slice(0, 2);

/** Translates into the browser language. */
export const t = (key, ...args) => translate(currentLang, key, ...args);
